if(! servicemgr) var servicemgr = {};

// servicemgr namespace and 
servicemgr.reload_services = function() {
		var self = this;

		$('#service_list').empty();
		
		$.each(this.data_json.services, function(index, service) {
			
			var element = "<h3><table width=\"100%\"><tr><td>";
			element += "<a href=\"#\">" + service.name + "</a>";
			element += "</td><td align=\"right\">";
			element += "<button id=\"edit_service_" + underscorify(service.name) + "\" name=\"" + service.name + "\">Edit</button> ";
			element += "<button id=\"remove_service_" + underscorify(service.name) + "\" name=\"" + service.name + "\">Remove</button>"
			element += "</td></tr></table></h3>";
			element += "<div>";
			element += "<p/>";
			element += "<b>Description</b>: " + service.description + "<p/>";
			element += "<b>Version</b>: " + service.version + "<p/>";
			element += "<b>Dependencies</b>: " + (service.dependencies.length > 0 ? service.dependencies.join(", ") : "none") + "<p/>";
			element += "<b>Color</b>: <span style=\"background-color:" + service.color + "\">&nbsp;&nbsp;&nbsp;&nbsp;</span><p/>";
			element += "</div>";
									
			$('#service_list').append(element);
		});
		
		this.refresh_services_ui();
		draggr.reload_service_list();
		
		$.each(this.data_json.services, function(index, service) {
			$("#edit_service_" + underscorify(service.name)).button();
			$("#edit_service_" + underscorify(service.name)).click(function() {
				self.edit_service(service);
			});
			$("#remove_service_" + underscorify(service.name)).button();			
			$("#remove_service_" + underscorify(service.name)).click(function() {
				var service_name = $(this).attr("name");
				self.delete_service(service_name);
			});
		});
};

servicemgr.delete_service = function(service_name_to_remove) {
		
		var new_service_array = $.grep(this.data_json.services, function(service) {
		    return service.name != service_name_to_remove;
		});
		
		/*TODO: separate out*/
		var exist_dependencies = [];
		$.each(new_service_array, function(service_index, a_service) {
			if(! depmgr.validate_dependencies_for(service_name_to_remove, a_service.dependencies)) {
				exist_dependencies.push(a_service.name);
			} // else -- validation passed, continue
		});
		if(exist_dependencies.length > 0) {
			$.alert("Can't remove a service that other services depend on: " + exist_dependencies.join(", "));
			return;
		}
		/*end TODO*/
		
		this.data_json.services = new_service_array;
		
		$('#json_source').val(JSON.stringify(data_json, null, 4));
		this.reload_services();
		$.allContainingText(service_name_to_remove, "#drag div").remove();
		$.each(this.data_json.hosts, function(host_index, a_host) {
			$.each(a_host.services, function(service_index, a_service) {
				if(a_service.name == service_name_to_remove) a_host.services.splice(service_index, 1);
			});
		});
};

servicemgr.add_service = function() {
	var new_service = {"name": "New_service", "version": "Unknown", "description": "None", "color": "lightblue", "dependencies": []};
	if(! this.has_service_within(new_service.name, this.data_json.services)) {
		this.data_json.services.unshift(new_service);
	} else {
		$.alert("Service with this name already exists.");
	}
	this.reload_services();
}

servicemgr.edit_service = function(service) {
	var self = this;
	$("#edit-service-form").dialog({
				autoOpen: false,
				height: 600,
				width: 600,
				modal: true,
				buttons: {
					"Save": function() {
						var old_name = service.name;
						var new_name = $("#edit_service_name").val();
						draggr.redraw_service_on_hosts(old_name, new_name, $("#edit_service_color").val());
						service.name = new_name;
						service.version = $("#edit_service_version").val();
						service.description = $("#edit_service_description").val();
						service.color = $("#edit_service_color").val();
						var dependencies = depmgr.convert_string_to_dep_array($("#edit_service_dependencies").val());
						if(! depmgr.validate_dependencies_for(service.name, dependencies)) {
							$.alert("The following dependencies are incorrect: " + depmgr.get_incorrect_dependencies_for(service.name, dependencies).join(", "));
							return false;
						} // else -- dependencies are correct, proceed
						service.dependencies = dependencies;
						depmgr.update_dependency_names(old_name, new_name);
						$(this).dialog("close");
					},
					Cancel: function() {
						$(this).dialog("close");
					}
				},
				close: function() {
					self.reload_services();
				}
	});
	$("#edit_service_name").val(service.name);
	$("#edit_service_version").val(service.version);	
	$("#edit_service_description").val(service.description);
	$("#edit_service_color").val(service.color);
	$("#edit_service_dependencies").val(service.dependencies.join(","));	
	$("#edit-service-form").dialog("open");
}

servicemgr.find_service_by_name_within = function(service_name, services) {
	var found_services = $.grep(services, function(a_service) {
		return a_service.name == service_name;
	}); // has either 0 or 1 element due to our unique-name constraints
	return (found_services.length > 0 ? found_services[0] : null);
}

servicemgr.has_service_within = function(service_name, services) {
	return this.find_service_by_name_within(service_name, services) != null;
}

servicemgr.refresh_services_ui = function() {
		$('#service_list').accordion('destroy').accordion();
};